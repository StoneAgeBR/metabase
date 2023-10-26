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
  const icon = action === "add" ? "add" : "eye_outline";
  const iconSelector = `.Icon-${icon}`;
  cy.findAllByRole("listitem", { name: columnName }).find(iconSelector).click();
}

function saveQuestion() {
  cy.intercept("POST", "/api/card").as("saveQuestion");

  cy.findByTestId("qb-header-action-panel").findByText("Save").click();
  cy.get(".Modal").within(() => {
    cy.button("Save").click();
    // Make sure the forms in the modal are gone from the DOM after the save
    cy.findByLabelText("Name").should("not.be.visible");
  });

  // Rather than trying to find "Not now" (when asked to save the question to the dashboard),
  // we're simply closing the modal. Trying to find and click "Not now" led to numerous flakes
  // due to some weird out-of-sync transitions in the FE code related to the save question modal.
  cy.get(".Modal").icon("close");

  return cy.wait("@saveQuestion");
}
