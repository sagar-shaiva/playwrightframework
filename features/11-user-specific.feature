@bdd @bdd11
Feature: User-specific dashboards

  @auth-BM
  Scenario: Branch Manager opens their dashboard
    Given the user-specific dashboard is open as a Branch Manager
    Then the dashboard identifies the Branch Manager

  @auth-MG
  Scenario: Manager opens the transaction dashboard
    Given the user-specific dashboard is open as a Manager
    When the Manager opens transactions
    Then the transaction dashboard identifies the Manager
