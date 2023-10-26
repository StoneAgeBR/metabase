import { createMockField, createMockTable } from "metabase-types/api/mocks";
import {
  createOrdersTable,
  createPeopleTable,
  createProductsTable,
  createReviewsTable,
  createSampleDatabase,
} from "metabase-types/api/mocks/presets";
import { createMockMetadata } from "__support__/metadata";
import * as Lib from "metabase-lib";
import { columnFinder, createQuery } from "metabase-lib/test-helpers";

const TEST_DB = createSampleDatabase({
  tables: [
    createOrdersTable(),
    createProductsTable(),
    createReviewsTable(),
    createPeopleTable(),
    createMockTable({
      id: 100,
      name: "ACCOUNTS",
      display_name: "Accounts",
      fields: [
        createMockField({
          id: 101,
          table_id: 100,
          name: "ACTIVE_SUBSCRIPTION",
          display_name: "Active Subscription",
          base_type: "type/Boolean",
          effective_type: "type/Boolean",
          semantic_type: "type/Category",
        }),
      ],
    }),
  ],
});

const TEST_METADATA = createMockMetadata({
  databases: [TEST_DB],
});

function findColumn(query: Lib.Query, tableName: string, columnName: string) {
  const columns = Lib.filterableColumns(query, 0);
  return columnFinder(query, columns)(tableName, columnName);
}

function filterByColumn<T extends Lib.FilterParts>(
  query: Lib.Query,
  filterClause: Lib.ExpressionClause,
  getFilterParts: (
    query: Lib.Query,
    stageIndex: number,
    clause: Lib.FilterClause,
  ) => T | null,
) {
  const newQuery = Lib.filter(query, 0, filterClause);
  const [newFilterClause] = Lib.filters(newQuery, 0);
  const newFilterParts = getFilterParts(newQuery, 0, newFilterClause);
  const newColumnInfo = newFilterParts
    ? Lib.displayInfo(newQuery, 0, newFilterParts.column)
    : null;

  return {
    newQuery,
    filterParts: newFilterParts,
    columnInfo: newColumnInfo,
  };
}

function filterByStringColumn(
  query: Lib.Query,
  filterClause: Lib.ExpressionClause,
) {
  return filterByColumn(query, filterClause, Lib.stringFilterParts);
}

function filterByNumberColumn(
  query: Lib.Query,
  filterClause: Lib.ExpressionClause,
) {
  return filterByColumn(query, filterClause, Lib.numberFilterParts);
}

describe("filter", () => {
  const query = createQuery({ metadata: TEST_METADATA });

  describe("string filters", () => {
    const tableName = "PRODUCTS";
    const columnName = "CATEGORY";
    const column = findColumn(query, tableName, columnName);

    it.each<Lib.StringFilterOperatorName>([
      "=",
      "!=",
      "contains",
      "does-not-contain",
      "starts-with",
      "ends-with",
    ])(
      'should be able to create and destructure a string filter with "%s" operator and a single value',
      operator => {
        const { filterParts, columnInfo } = filterByStringColumn(
          query,
          Lib.stringFilterClause({
            operator,
            column,
            values: ["Gadget"],
            options: {},
          }),
        );

        expect(filterParts).toMatchObject({
          operator,
          column: expect.anything(),
          values: ["Gadget"],
          options: {},
        });
        expect(columnInfo?.name).toBe(columnName);
      },
    );

    it.each<Lib.StringFilterOperatorName>(["=", "!="])(
      'should be able to create and destructure a string filter with "%s" operator and multiple values',
      operator => {
        const { filterParts, columnInfo } = filterByStringColumn(
          query,
          Lib.stringFilterClause({
            operator,
            column,
            values: ["Gadget", "Widget"],
            options: {},
          }),
        );

        expect(filterParts).toMatchObject({
          operator,
          column: expect.anything(),
          values: ["Gadget", "Widget"],
          options: {},
        });
        expect(columnInfo?.name).toBe(columnName);
      },
    );

    it.each<Lib.StringFilterOperatorName>([
      "is-null",
      "not-null",
      "is-empty",
      "not-empty",
    ])(
      'should be able to create and destructure a string filter with "%s" operator without values',
      operator => {
        const { filterParts, columnInfo } = filterByStringColumn(
          query,
          Lib.stringFilterClause({
            operator,
            column,
            values: [],
            options: {},
          }),
        );

        expect(filterParts).toMatchObject({
          operator,
          column: expect.anything(),
          values: [],
          options: {},
        });
        expect(columnInfo?.name).toBe(columnName);
      },
    );

    it.each<Lib.StringFilterOperatorName>([
      "contains",
      "does-not-contain",
      "starts-with",
      "ends-with",
    ])(
      'should fill defaults for case sensitivity options for "%s" operator',
      () => {
        const { filterParts, columnInfo } = filterByStringColumn(
          query,
          Lib.stringFilterClause({
            operator: "starts-with",
            column,
            values: ["Gadget"],
            options: {},
          }),
        );

        expect(filterParts).toMatchObject({
          operator: "starts-with",
          column: expect.anything(),
          values: ["Gadget"],
          options: { "case-sensitive": false },
        });
        expect(columnInfo?.name).toBe(columnName);
      },
    );

    it.each<Lib.StringFilterOperatorName>([
      "contains",
      "does-not-contain",
      "starts-with",
      "ends-with",
    ])('should use provided case sensitivity options for "%s" operator', () => {
      const { filterParts, columnInfo } = filterByStringColumn(
        query,
        Lib.stringFilterClause({
          operator: "starts-with",
          column,
          values: ["Gadget"],
          options: { "case-sensitive": true },
        }),
      );

      expect(filterParts).toMatchObject({
        operator: "starts-with",
        column: expect.anything(),
        values: ["Gadget"],
        options: { "case-sensitive": true },
      });
      expect(columnInfo?.name).toBe(columnName);
    });

    it.each<Lib.StringFilterOperatorName>([
      "=",
      "!=",
      "is-null",
      "not-null",
      "is-empty",
      "not-empty",
    ])(
      'should ignore case sensitivity options as they are not supported by "%s" operator',
      () => {
        const { filterParts, columnInfo } = filterByStringColumn(
          query,
          Lib.stringFilterClause({
            operator: "=",
            column,
            values: ["Gadget"],
            options: { "case-sensitive": true },
          }),
        );

        expect(filterParts).toMatchObject({
          operator: "=",
          column: expect.anything(),
          values: ["Gadget"],
          options: {},
        });
        expect(columnInfo?.name).toBe(columnName);
      },
    );

    it("should ignore expressions with not supported operators", () => {
      const { filterParts } = filterByStringColumn(
        query,
        Lib.expressionClause("concat", [
          findColumn(query, tableName, columnName),
          "A",
        ]),
      );

      expect(filterParts).toBeNull();
    });

    it("should ignore expressions without first column", () => {
      const { filterParts } = filterByStringColumn(
        query,
        Lib.expressionClause("=", ["A", column]),
      );

      expect(filterParts).toBeNull();
    });

    it("should ignore expressions with non-string arguments", () => {
      const { filterParts } = filterByStringColumn(
        query,
        Lib.expressionClause("=", [column, column]),
      );

      expect(filterParts).toBeNull();
    });
  });

  describe("number filters", () => {
    const tableName = "ORDERS";
    const columnName = "TOTAL";
    const column = findColumn(query, tableName, columnName);

    it.each<Lib.NumberFilterOperatorName>(["=", "!=", ">", ">", ">=", "<="])(
      'should be able to create and destructure a number filter with "%s" operator and a single value',
      operator => {
        const { filterParts, columnInfo } = filterByNumberColumn(
          query,
          Lib.numberFilterClause({
            operator,
            column,
            values: [10],
          }),
        );

        expect(filterParts).toMatchObject({
          operator,
          column: expect.anything(),
          values: [10],
        });
        expect(columnInfo?.name).toBe(columnName);
      },
    );

    it.each<Lib.NumberFilterOperatorName>(["=", "!="])(
      'should be able to create and destructure a number filter with "%s" operator and multiple values',
      operator => {
        const { filterParts, columnInfo } = filterByNumberColumn(
          query,
          Lib.numberFilterClause({
            operator,
            column,
            values: [1, 2, 3],
          }),
        );

        expect(filterParts).toMatchObject({
          operator,
          column: expect.anything(),
          values: [1, 2, 3],
        });
        expect(columnInfo?.name).toBe(columnName);
      },
    );

    it.each<Lib.NumberFilterOperatorName>(["between"])(
      'should be able to create and destructure a number filter with "%s" operator and exactly 2 values',
      operator => {
        const { filterParts, columnInfo } = filterByNumberColumn(
          query,
          Lib.numberFilterClause({
            operator,
            column,
            values: [1, 2],
          }),
        );

        expect(filterParts).toMatchObject({
          operator,
          column: expect.anything(),
          values: [1, 2],
        });
        expect(columnInfo?.name).toBe(columnName);
      },
    );

    it.each<Lib.NumberFilterOperatorName>(["is-null", "not-null"])(
      'should be able to create and destructure a number filter with "%s" operator without values',
      operator => {
        const { filterParts, columnInfo } = filterByNumberColumn(
          query,
          Lib.numberFilterClause({
            operator,
            column,
            values: [],
          }),
        );

        expect(filterParts).toMatchObject({
          operator,
          column: expect.anything(),
          values: [],
        });
        expect(columnInfo?.name).toBe(columnName);
      },
    );

    it("should ignore expressions with not supported operators", () => {
      const { filterParts } = filterByNumberColumn(
        query,
        Lib.expressionClause("starts-with", [
          findColumn(query, tableName, columnName),
          "A",
        ]),
      );

      expect(filterParts).toBeNull();
    });

    it("should ignore expressions without first column", () => {
      const { filterParts } = filterByNumberColumn(
        query,
        Lib.expressionClause("=", [10, column]),
      );

      expect(filterParts).toBeNull();
    });

    it("should ignore expressions with non-string arguments", () => {
      const { filterParts } = filterByNumberColumn(
        query,
        Lib.expressionClause("=", [column, column]),
      );

      expect(filterParts).toBeNull();
    });
  });
});
