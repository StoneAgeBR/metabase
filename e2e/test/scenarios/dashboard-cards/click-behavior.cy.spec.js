import {
  createActionCard,
  createHeadingCard,
  createTextCard,
  getDashboardCardMenu,
  restore,
  showDashboardCardActions,
  updateDashboardCards,
  visitDashboard,
} from "e2e/support/helpers";

describe("scenarios > dashboard > dashboard cards > click behavior", () => {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();
    cy.intercept("POST", "/api/dataset").as("dataset");
  });

  describe("visualizations without click behavior", () => {
    it("does not allow to set click behavior for virtual dashcards", () => {
      cy.createDashboard().then(({ body: dashboard }) => {
        const textCard = createTextCard({ size_y: 1 });
        const headingCard = createHeadingCard();
        const actionCard = createActionCard();
        const cards = [textCard, headingCard, actionCard];

        updateDashboardCards({ dashboard_id: dashboard.id, cards });
        visitDashboard(dashboard.id);

        cards.forEach((card, index) => {
          const display = card.visualization_settings.virtual_card.display;
          cy.log(`does not allow to set click behavior for "${display}" card`);

          showDashboardCardActions(index);
          getDashboardCardMenu(index).should("not.exist");
        });
      });
    });
  });
});
