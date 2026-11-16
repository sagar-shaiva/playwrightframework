@bdd @bdd11
Feature: Role-specific dashboards

  @auth-BM
  Scenario: Branch Manager sees the correct dashboard
    Given the Branch Manager dashboard is displayed
    Then the dashboard identifies the Branch Manager

  @auth-MG
  Scenario: Manager opens the transaction dashboard
    Given the Manager dashboard is displayed
    When I open the transactions page
    Then the transaction dashboard identifies the Manager
