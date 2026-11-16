@bdd @bdd08
Feature: Multiple user sessions

  @auth-T
  Scenario: Teller and Branch Manager use separate sessions
    Given I am signed in as the Teller
    When I open a session as the Branch Manager
    Then the second session is authenticated as the Branch Manager

  @auth-T
  Scenario: Teller and Manager use separate sessions
    Given the authenticated session is ready
    When I open a session as the Manager
    Then the second session is authenticated as the Manager
