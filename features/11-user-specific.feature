@bdd @bdd11
Feature: Role-specific dashboards
  Each user sees their own user ID on the pages they open.

  @auth-branchManager
  Scenario: The Branch Manager dashboard shows the Branch Manager
    Given I am on the dashboard
    Then I am authenticated as "branchManager"

  @auth-manager
  Scenario: The transaction page shows the Manager
    Given I am on the dashboard
    When I open the transaction page
    Then I see the transaction page welcome "manager"
