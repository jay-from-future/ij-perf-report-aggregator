package main

import (
  "context"
  detector "github.com/JetBrains/ij-perf-report-aggregator/pkg/degradation-detector"
  "github.com/JetBrains/ij-perf-report-aggregator/pkg/degradation-detector/analysis"
  "log"
  "os"
  "sync"
)

func main() {
  backendUrl := os.Getenv("BACKEND_URL")
  if len(backendUrl) == 0 {
    backendUrl = "https://ij-perf-api.labs.jb.gg"
    log.Printf("BACKEND_URL is not set, using default value: %s", backendUrl)
  }

  analysisSettings := make([]analysis.Settings, 0, 1000)
  analysisSettings = append(analysisSettings, analysis.GenerateIdeaSettings()...)
  analysisSettings = append(analysisSettings, analysis.GenerateWorkspaceSettings()...)
  analysisSettings = append(analysisSettings, analysis.GenerateKotlinSettings()...)
  analysisSettings = append(analysisSettings, analysis.GenerateMavenSettings()...)
  analysisSettings = append(analysisSettings, analysis.GenerateGradleSettings()...)
  analysisSettings = append(analysisSettings, analysis.GeneratePhpStormSettings()...)

  ctx := context.Background()
  degradations := make([]detector.Degradation, 0, 1000)
  for _, analysisSetting := range analysisSettings {
    log.Printf("Processing %v", analysisSetting)
    timestamps, values, builds, err := detector.GetDataFromClickhouse(ctx, backendUrl, analysisSetting)
    if err != nil {
      log.Printf("%v", err)
    }

    degradations = append(degradations, detector.InferDegradations(values, builds, timestamps, analysisSetting)...)
  }

  insertionResults := detector.PostDegradation(ctx, backendUrl, degradations)

  var wg sync.WaitGroup
  for _, result := range insertionResults {
    if result.Error != nil {
      log.Printf("%v", result.Error)
      continue
    }
    if !result.WasInserted {
      continue
    }
    wg.Add(1)
    go func(result detector.InsertionResults) {
      defer wg.Done()
      err := detector.SendSlackMessage(ctx, result.Degradation)
      if err != nil {
        log.Printf("%v", err)
      }
    }(result)
  }
  wg.Wait()
}
