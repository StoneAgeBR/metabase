import {
  restore,
  popover,
  openOrdersTable,
  visitDashboard,
} from "e2e/support/helpers";
import { SAMPLE_DATABASE } from "e2e/support/cypress_sample_database";

const { ORDERS, PRODUCTS } = SAMPLE_DATABASE;

describe("issue 23293", () => {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();
  });

  it("should retain the filter when drilling through the dashboard card with implicitly added column (metabase#23293)", () => {
    openOrdersTable();

    cy.findByTestId("viz-settings-button").click();
    modifyColumn("Product ID", "remove");
    modifyColumn("Category", "add");
    cy.wait("@dataset");

    saveQuestion().then(
      ({
        response: {
          body: { id },
        },
      }) => {
        const questionDetails = {
          query: {
            "source-table": `card__${id}`,
            aggregation: [["count"]],
            breakout: [
              [
                "field",
                PRODUCTS.CATEGORY,
                {
                  "source-field": ORDERS.PRODUCT_ID,
                },
              ],
            ],
          },
          display: "bar",
        };

        cy.createQuestionAndDashboard({ questionDetails }).then(
          ({ body: { dashboard_id } }) => {
            visitDashboard(dashboard_id);
          },
        );

        cy.get(".bar").first().realClick();
        popover()
          .findByText(/^See these/)
          .click();

        cy.findByTestId("qb-filters-panel").should(
          "contain",
          "Product → Category is Doohickey",
        );
        cy.findAllByTestId("header-cell")
          .last()
          .should("have.text", "Product → Category");

        cy.findAllByRole("grid")
          .last()
          .as("tableResults")
          .should("contain", "Doohickey")
          .and("not.contain", "Gizmo");
      },
    );
  });
});

/**
 * @param {string} columnName
 * @param {("add"|"remove")} action
 */
function modifyColumn(columnName, action) {
  cy.findByRole("button", { name: "Add or remove columns" }).click();
  if (action === "add") {
    cy.findByLabelText(columnName).should("not.be.checked").click();
  } else {
    cy.findByLabelText(columnName).should("be.checked").click();
  }

  cy.findByRole("button", { name: "Done picking columns" }).click();
}

function saveQuestion() {
  cy.intercept("POST", "/api/card").as("saveQuestion");

  cy.findByTestId("qb-header-action-panel").findByText("Save").click();
  cy.get(".Modal").button("Save").click();
  cy.get(".Modal").button("Not now").click();

  return cy.wait("@saveQuestion");
}
