package analyzer

import (
  "context"
  "crypto/sha1"
  "encoding/base64"
  "github.com/bvinc/go-sqlite-lite/sqlite3"
  "github.com/develar/errors"
  "github.com/json-iterator/go"
  "github.com/tdewolff/minify/v2"
  "github.com/tdewolff/minify/v2/json"
  "go.uber.org/zap"
  "hash"
  "report-aggregator/pkg/model"
  "report-aggregator/pkg/util"
  "strconv"
  "strings"
  "sync"
  "time"
)

type ReportAnalyzer struct {
  input        chan *model.Report
  waitChannel  chan struct{}
  ErrorChannel chan error

  analyzeContext context.Context

  waitGroup sync.WaitGroup
  closeOnce sync.Once

  minifier *minify.M
  db       *sqlite3.Conn

  insertReportStatement  *sqlite3.Stmt
  insertMachineStatement *sqlite3.Stmt

  hash hash.Hash

  logger *zap.Logger
}

func CreateReportAnalyzer(dbPath string, analyzeContext context.Context, logger *zap.Logger) (*ReportAnalyzer, error) {
  err := prepareDatabaseFile(dbPath, logger)
  if err != nil {
    return nil, errors.WithStack(err)
  }

  db, err := prepareDatabase(dbPath, logger)
  if err != nil {
    return nil, err
  }

  m := minify.New()
  m.AddFunc("json", json.Minify)

  analyzer := &ReportAnalyzer{
    input:          make(chan *model.Report),
    analyzeContext: analyzeContext,
    waitChannel:    make(chan struct{}),
    ErrorChannel:   make(chan error),

    minifier: m,
    db:       db,
    hash:     sha1.New(),

    logger: logger,
  }

  go func() {
    for {
      select {
      case <-analyzeContext.Done():
        logger.Debug("analyze stopped")
        return

      case report, ok := <-analyzer.input:
        if !ok {
          return
        }

        err := analyzer.doAnalyze(report)
        if err != nil {
          analyzer.ErrorChannel <- err
        }
      }
    }
  }()
  return analyzer, nil
}

func readReport(data []byte) (*model.Report, error) {
  var report model.Report
  err := jsoniter.ConfigFastest.Unmarshal(data, &report)
  if err != nil {
    return nil, errors.WithStack(err)
  }
  return &report, nil
}

type ExtraData struct {
  LastGeneratedTime int64

  ProductCode string
  BuildNumber string

  Machine string
}

func (t *ReportAnalyzer) Analyze(data []byte, extraData ExtraData) error {
  if t.analyzeContext.Err() != nil {
    return nil
  }

  report, err := readReport(data)
  if err != nil {
    return err
  }

  if len(report.ProductCode) == 0 {
    report.ProductCode = extraData.ProductCode
  }
  if len(report.Build) == 0 {
    report.Build = extraData.BuildNumber
  }

  if len(extraData.Machine) == 0 {
    return errors.New("machine is not specified")
  }
  report.Machine = extraData.Machine

  if t.analyzeContext.Err() != nil {
    return nil
  }

  // normalize to compute consistent unique id
  report.RawData, err = t.minifier.Bytes("json", data)
  if err != nil {
    return err
  }

  if t.analyzeContext.Err() != nil {
    return nil
  }

  err = computeGeneratedTime(report, extraData)
  if err != nil {
    return err
  }

  t.input <- report
  return nil
}

func computeGeneratedTime(report *model.Report, extraData ExtraData) error {
  if report.Generated == "" {
    if extraData.LastGeneratedTime <= 0 {
      return errors.New("Generated time not in report and not provided explicitly")
    }
    report.GeneratedTime = extraData.LastGeneratedTime
  } else {
    parsedTime, err := parseTime(report)
    if err != nil {
      return err
    }
    report.GeneratedTime = parsedTime.Unix()
  }
  return nil
}

func parseTime(report *model.Report) (*time.Time, error) {
  parsedTime, err := time.Parse(time.RFC1123Z, report.Generated)
  if err != nil {
    parsedTime, err = time.Parse(time.RFC1123, report.Generated)
  }

  if err != nil {
    parsedTime, err = time.Parse("Jan 2, 2006, 3:04:05 PM MST", report.Generated)
  }

  if err != nil {
    parsedTime, err = time.Parse("Mon, 2 Jan 2006 15:04:05 -0700", report.Generated)
  }

  if err != nil {
    return nil, errors.WithStack(err)
  }
  return &parsedTime, nil
}

func (t *ReportAnalyzer) Close() error {
  t.closeOnce.Do(func() {
    close(t.input)
  })

  statement := t.insertReportStatement
  if statement != nil {
    t.insertReportStatement = nil
    util.Close(statement, t.logger)
  }

  statement = t.insertMachineStatement
  if statement != nil {
    t.insertMachineStatement = nil
    util.Close(statement, t.logger)
  }

  db := t.db
  t.db = nil
  if db == nil {
    return nil
  }
  return errors.WithStack(db.Close())
}

func (t *ReportAnalyzer) Done() <-chan struct{} {
  go func() {
    t.waitGroup.Wait()
    close(t.waitChannel)
  }()
  return t.waitChannel
}

const metricsVersion = 3

func (t *ReportAnalyzer) doAnalyze(report *model.Report) error {
  t.waitGroup.Add(1)
  defer t.waitGroup.Done()

  t.hash.Reset()
  _, err := t.hash.Write(report.RawData)
  if err != nil {
    return errors.WithStack(err)
  }

  id := base64.RawURLEncoding.EncodeToString(t.hash.Sum(nil))

  currentMetricsVersion, err := t.getMetricsVersion(id)
  if err != nil {
    return errors.WithStack(err)
  }

  logger := t.logger.With(zap.String("id", id), zap.String("generatedTime", time.Unix(report.GeneratedTime, 0).Format(time.RFC1123)))
  if currentMetricsVersion == metricsVersion {
    logger.Info("report already processed")
    return nil
  }

  durationMetrics, instantMetrics := t.computeMetrics(report, logger)
  // or both null, or not - no need to check each one
  if durationMetrics == nil || instantMetrics == nil {
    return nil
  }

  serializedDurationMetrics, err := jsoniter.ConfigFastest.Marshal(durationMetrics)
  if err != nil {
    return errors.WithStack(err)
  }

  serializedInstantMetrics, err := jsoniter.ConfigFastest.Marshal(instantMetrics)
  if err != nil {
    return errors.WithStack(err)
  }

  buildComponents := strings.Split(report.Build, ".")
  if len(buildComponents) == 2 {
    buildComponents = append(buildComponents, "0")
  }

  buildC1, err := strconv.Atoi(buildComponents[0])
  if err != nil {
    return errors.WithStack(err)
  }
  buildC2, err := strconv.Atoi(buildComponents[1])
  if err != nil {
    return errors.WithStack(err)
  }
  buildC3, err := strconv.Atoi(buildComponents[2])
  if err != nil {
    return errors.WithStack(err)
  }

  statement := t.insertReportStatement
  if statement == nil {
    statement, err = t.db.Prepare(string(MustAsset("insert-report.sql")))
    if err != nil {
      return errors.WithStack(err)
    }

    t.insertReportStatement = statement
  }

  machineId, err := t.getMachineId(report.Machine)
  if err != nil {
    return errors.WithStack(err)
  }

  err = statement.Exec(id, machineId, report.GeneratedTime,
    report.ProductCode,
    buildC1, buildC2, buildC3,
    metricsVersion, serializedDurationMetrics, serializedInstantMetrics,
    report.RawData)
  if err != nil {
    return errors.WithStack(err)
  }

  if currentMetricsVersion >= 0 && currentMetricsVersion == metricsVersion {
    logger.Info("report metrics updated", zap.Int("oldMetricsVersion", currentMetricsVersion), zap.Int("newMetricsVersion", metricsVersion))
  } else {
    logger.Info("new report added")
  }
  return nil
}

// https://stackoverflow.com/questions/13244393/sqlite-insert-or-ignore-and-return-original-rowid
func (t *ReportAnalyzer) getMachineId(machineName string) (int, error) {
  statement := t.insertMachineStatement
  var err error
  if statement == nil {
    statement, err = t.db.Prepare("insert or ignore into machine(name) values(?)")
    if err != nil {
      return -1, errors.WithStack(err)
    }

    t.insertMachineStatement = statement
  }

  err = statement.Exec(machineName)
  if err != nil {
    return -1, errors.WithStack(err)
  }

  statement, err = t.db.Prepare("select ROWID from machine where name = ?")
  defer util.Close(statement, t.logger)

  if err != nil {
    return -1, errors.WithStack(err)
  }

  err = statement.Bind(machineName)
  if err != nil {
    return -1, errors.WithStack(err)
  }

  _, err = statement.Step()
  if err != nil {
    return -1, errors.WithStack(err)
  }

  id, _, err := statement.ColumnInt(0)
  return id, err
}

func (t *ReportAnalyzer) getMetricsVersion(id string) (int, error) {
  statement, err := t.db.Prepare(`SELECT metrics_version FROM report WHERE id = ?`, id)
  if err != nil {
    return 1, errors.WithStack(err)
  }

  defer util.Close(statement, t.logger)

  hasRow, err := statement.Step()
  if err != nil {
    return -1, errors.WithStack(err)
  }

  if hasRow {
    result, _, err := statement.ColumnInt(0)
    return result, errors.WithStack(err)
  }

  return -1, nil
}
