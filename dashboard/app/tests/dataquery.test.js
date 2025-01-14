import { expect, test } from "vitest"
import { mergeQueries } from "new-dashboard/src/components/common/DataQueryExecutor"

test("complex queries are not merged", () => {
  expect(
    mergeQueries([
      {
        db: "perfint",
        table: "idea",
        fields: [
          {
            n: "measures",
            subName: "value",
          },
        ],
        filters: [
          {
            f: "branch",
            v: "master",
          },
          {
            f: "generated_time",
            q: ">subtractMonths(now(),3)",
          },
          {
            f: "machine",
            v: "intellij-linux-performance-aws-%",
            o: "like",
          },
          {
            f: "measures.name",
            v: "completion_%",
            o: "like",
          },
        ],
        order: "t",
        aggregator: "avg",
        dimensions: [
          {
            n: "t",
            sql: "toYYYYMMDD(generated_time)",
          },
        ],
      },
      {
        db: "perfint",
        table: "idea",
        fields: [
          {
            n: "measures",
            subName: "value",
          },
        ],
        filters: [
          {
            f: "branch",
            v: "232%",
            o: "like",
          },
          {
            f: "generated_time",
            q: ">subtractMonths(now(),3)",
          },
          {
            f: "machine",
            v: "intellij-linux-performance-aws-%",
            o: "like",
          },
          {
            f: "measures.name",
            v: "completion_%",
            o: "like",
          },
        ],
        order: "t",
        aggregator: "avg",
        dimensions: [
          {
            n: "t",
            sql: "toYYYYMMDD(generated_time)",
          },
        ],
      },
    ])
  ).toStrictEqual([
    {
      db: "perfint",
      table: "idea",
      fields: [
        {
          n: "measures",
          subName: "value",
        },
      ],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "measures.name",
          v: "completion_%",
          o: "like",
        },
      ],
      order: "t",
      aggregator: "avg",
      dimensions: [
        {
          n: "t",
          sql: "toYYYYMMDD(generated_time)",
        },
      ],
    },
    {
      db: "perfint",
      table: "idea",
      fields: [
        {
          n: "measures",
          subName: "value",
        },
      ],
      filters: [
        {
          f: "branch",
          v: "232%",
          o: "like",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "measures.name",
          v: "completion_%",
          o: "like",
        },
      ],
      order: "t",
      aggregator: "avg",
      dimensions: [
        {
          n: "t",
          sql: "toYYYYMMDD(generated_time)",
        },
      ],
    },
  ])
})

test("merge by project", () => {
  const actual = mergeQueries([
    {
      db: "perfint",
      table: "idea",
      fields: ["project"],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "intellij_sources/vfsRefresh/default",
        },
        {
          f: "measures.name",
          v: "vfs_initial_refresh",
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      fields: ["project"],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "intellij_sources/vfsRefresh/with-1-thread(s)",
        },
        {
          f: "measures.name",
          v: "vfs_initial_refresh",
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      fields: ["project"],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "intellij_sources/vfsRefresh/git-status",
        },
        {
          f: "measures.name",
          v: "vfs_initial_refresh",
        },
      ],
      order: "t",
    },
  ])
  expect(actual).toStrictEqual([
    {
      db: "perfint",
      table: "idea",
      fields: ["project"],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: ["intellij_sources/vfsRefresh/default", "intellij_sources/vfsRefresh/with-1-thread(s)", "intellij_sources/vfsRefresh/git-status"],
          s: true,
        },
        {
          f: "measures.name",
          v: "vfs_initial_refresh",
        },
      ],
      order: "t",
    },
  ])
})

test("merge in case of metric and project", () => {
  const actual = mergeQueries([
    {
      db: "perfint",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
        "tc_installer_build_id",
        "build_c1",
        "build_c2",
        "build_c3",
      ],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "community/indexing",
        },
        {
          f: "measures.name",
          v: "indexing",
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
        "tc_installer_build_id",
        "build_c1",
        "build_c2",
        "build_c3",
      ],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "community/indexing",
        },
        {
          f: "measures.name",
          v: "indexingTimeWithoutPauses",
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
        "tc_installer_build_id",
        "build_c1",
        "build_c2",
        "build_c3",
      ],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "intellij_sources/indexing",
        },
        {
          f: "measures.name",
          v: "indexing",
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
        "tc_installer_build_id",
        "build_c1",
        "build_c2",
        "build_c3",
      ],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "intellij_sources/indexing",
        },
        {
          f: "measures.name",
          v: "indexingTimeWithoutPauses",
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
        "tc_installer_build_id",
        "build_c1",
        "build_c2",
        "build_c3",
      ],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "space/indexing",
        },
        {
          f: "measures.name",
          v: "indexing",
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
        "tc_installer_build_id",
        "build_c1",
        "build_c2",
        "build_c3",
      ],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "space/indexing",
        },
        {
          f: "measures.name",
          v: "indexingTimeWithoutPauses",
        },
      ],
      order: "t",
    },
  ])
  expect(actual).toStrictEqual([
    {
      db: "perfint",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
        "tc_installer_build_id",
        "build_c1",
        "build_c2",
        "build_c3",
      ],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "community/indexing",
        },
        {
          f: "measures.name",
          v: ["indexing", "indexingTimeWithoutPauses"],
          s: true,
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
        "tc_installer_build_id",
        "build_c1",
        "build_c2",
        "build_c3",
      ],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "intellij_sources/indexing",
        },
        {
          f: "measures.name",
          v: ["indexing", "indexingTimeWithoutPauses"],
          s: true,
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
        "tc_installer_build_id",
        "build_c1",
        "build_c2",
        "build_c3",
      ],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "space/indexing",
        },
        {
          f: "measures.name",
          v: ["indexing", "indexingTimeWithoutPauses"],
          s: true,
        },
      ],
      order: "t",
    },
  ])
})

test("single query as is", () => {
  const actual = mergeQueries([
    {
      db: "perfint",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
        "tc_installer_build_id",
        "build_c1",
        "build_c2",
        "build_c3",
      ],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "kotlin_petclinic/debug",
        },
        {
          f: "measures.name",
          v: "debugRunConfiguration",
        },
      ],
      order: "t",
    },
  ])
  expect(actual).toStrictEqual([
    {
      db: "perfint",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
        "tc_installer_build_id",
        "build_c1",
        "build_c2",
        "build_c3",
      ],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "kotlin_petclinic/debug",
        },
        {
          f: "measures.name",
          v: "debugRunConfiguration",
        },
      ],
      order: "t",
    },
  ])
})

test("don't merge with operator", () => {
  const actual = mergeQueries([
    {
      db: "perfint",
      table: "idea",
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "kotlin_petclinic/debug",
        },
        {
          f: "measures.name",
          v: "debugRunConfiguration",
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      filters: [
        {
          f: "branch",
          v: "232%",
          o: "like",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "kotlin_petclinic/debug",
        },
        {
          f: "measures.name",
          v: "debugRunConfiguration",
        },
      ],
      order: "t",
    },
  ])
  expect(actual).toStrictEqual([
    {
      db: "perfint",
      table: "idea",
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "kotlin_petclinic/debug",
        },
        {
          f: "measures.name",
          v: "debugRunConfiguration",
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      filters: [
        {
          f: "branch",
          v: "232%",
          o: "like",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "kotlin_petclinic/debug",
        },
        {
          f: "measures.name",
          v: "debugRunConfiguration",
        },
      ],
      order: "t",
    },
  ])
})

test("don't merge with but merge with project", () => {
  const actual = mergeQueries([
    {
      db: "perfint",
      table: "idea",
      fields: ["project"],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "community/rebuild",
        },
        {
          f: "measures.name",
          v: "build_compilation_duration",
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      fields: ["project"],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "intellij_sources/rebuild",
        },
        {
          f: "measures.name",
          v: "build_compilation_duration",
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      fields: ["project"],
      filters: [
        {
          f: "branch",
          v: "232%",
          o: "like",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "community/rebuild",
        },
        {
          f: "measures.name",
          v: "build_compilation_duration",
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      fields: ["project"],
      filters: [
        {
          f: "branch",
          v: "232%",
          o: "like",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: "intellij_sources/rebuild",
        },
        {
          f: "measures.name",
          v: "build_compilation_duration",
        },
      ],
      order: "t",
    },
  ])
  expect(actual).toStrictEqual([
    {
      db: "perfint",
      table: "idea",
      fields: ["project"],
      filters: [
        {
          f: "branch",
          v: "master",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: ["community/rebuild", "intellij_sources/rebuild"],
          s: true,
        },
        {
          f: "measures.name",
          v: "build_compilation_duration",
        },
      ],
      order: "t",
    },
    {
      db: "perfint",
      table: "idea",
      fields: ["project"],
      filters: [
        {
          f: "branch",
          v: "232%",
          o: "like",
        },
        {
          f: "generated_time",
          q: ">subtractMonths(now(),3)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "machine",
          v: "intellij-linux-performance-aws-%",
          o: "like",
        },
        {
          f: "build_c3",
          v: 0,
          o: "=",
        },
        {
          f: "project",
          v: ["community/rebuild", "intellij_sources/rebuild"],
          s: true,
        },
        {
          f: "measures.name",
          v: "build_compilation_duration",
        },
      ],
      order: "t",
    },
  ])
})

test("don't merge if merging field is not in query", () => {
  const actual = mergeQueries([
    {
      db: "perfintDev",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
      ],
      filters: [
        {
          f: "project",
          v: "project-import-jps-kotlin-50_000-modules/fastInstaller",
        },
        {
          f: "branch",
          v: "nikita.kudrin/jps_12_september_regression_on_suspect",
        },
        {
          f: "machine",
          v: ["intellij-linux-hw-hetzner-agent-06", "intellij-linux-hw-hetzner-agent-13", "intellij-linux-hw-hetzner-agent-17", "intellij-linux-hw-hetzner-agent-21"],
        },
        {
          f: "generated_time",
          q: ">subtractYears(now(),1)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "measures.name",
          v: "workspaceModel.to.snapshot.ms",
        },
      ],
      order: "t",
    },
    {
      db: "perfintDev",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
      ],
      filters: [
        {
          f: "project",
          v: "project-import-jps-kotlin-50_000-modules/fastInstaller",
        },
        {
          f: "branch",
          v: "nikita.kudrin/jps_12_september_regression_before",
        },
        {
          f: "machine",
          v: ["intellij-linux-hw-hetzner-agent-06", "intellij-linux-hw-hetzner-agent-13", "intellij-linux-hw-hetzner-agent-17", "intellij-linux-hw-hetzner-agent-21"],
        },
        {
          f: "generated_time",
          q: ">subtractYears(now(),1)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "measures.name",
          v: "workspaceModel.to.snapshot.ms",
        },
      ],
      order: "t",
    },
  ])
  expect(actual).toStrictEqual([
    {
      db: "perfintDev",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
      ],
      filters: [
        {
          f: "project",
          v: "project-import-jps-kotlin-50_000-modules/fastInstaller",
        },
        {
          f: "branch",
          v: "nikita.kudrin/jps_12_september_regression_on_suspect",
        },
        {
          f: "machine",
          v: ["intellij-linux-hw-hetzner-agent-06", "intellij-linux-hw-hetzner-agent-13", "intellij-linux-hw-hetzner-agent-17", "intellij-linux-hw-hetzner-agent-21"],
        },
        {
          f: "generated_time",
          q: ">subtractYears(now(),1)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "measures.name",
          v: "workspaceModel.to.snapshot.ms",
        },
      ],
      order: "t",
    },
    {
      db: "perfintDev",
      table: "idea",
      fields: [
        {
          n: "t",
          sql: "toUnixTimestamp(generated_time)*1000",
        },
        {
          n: "measures",
          subName: "value",
        },
        {
          n: "measures",
          subName: "name",
        },
        {
          n: "measures",
          subName: "type",
        },
        "machine",
        "tc_build_id",
        "project",
      ],
      filters: [
        {
          f: "project",
          v: "project-import-jps-kotlin-50_000-modules/fastInstaller",
        },
        {
          f: "branch",
          v: "nikita.kudrin/jps_12_september_regression_before",
        },
        {
          f: "machine",
          v: ["intellij-linux-hw-hetzner-agent-06", "intellij-linux-hw-hetzner-agent-13", "intellij-linux-hw-hetzner-agent-17", "intellij-linux-hw-hetzner-agent-21"],
        },
        {
          f: "generated_time",
          q: ">subtractYears(now(),1)",
        },
        {
          f: "triggeredBy",
          v: "",
        },
        {
          f: "measures.name",
          v: "workspaceModel.to.snapshot.ms",
        },
      ],
      order: "t",
    },
  ])
})

test("merging is correct", () => {
  const actual = mergeQueries([
    {
      db: "perfintDev",
      table: "idea",
      fields: ["project", "machine"],
      filters: [
        {
          f: "project",
          v: "gitlab-project-inspections-test/inspection-app",
        },
        {
          f: "machine",
          v: ["intellij-macos-hw-munit-692"],
        },
      ],
      order: "t",
    },
    {
      db: "perfintDev",
      table: "idea",
      fields: ["project", "machine"],
      filters: [
        {
          f: "project",
          v: "gitlab-project-inspections-test/inspection-RubyResolve-app",
        },
        {
          f: "machine",
          v: ["intellij-macos-hw-munit-692"],
        },
      ],
      order: "t",
    },
  ])
  expect(actual).toStrictEqual([
    {
      db: "perfintDev",
      table: "idea",
      fields: ["project", "machine"],
      filters: [
        {
          f: "project",
          v: ["gitlab-project-inspections-test/inspection-app", "gitlab-project-inspections-test/inspection-RubyResolve-app"],
          s: true,
        },
        {
          f: "machine",
          v: ["intellij-macos-hw-munit-692"],
        },
      ],
      order: "t",
    },
  ])
})
