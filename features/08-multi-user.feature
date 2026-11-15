@bdd @bdd08
Feature: Work with multiple users

  @auth-T
  Scenario: Teller and Branch Manager use separate sessions
    Given the multi-user dashboard is open for a Teller
    When the Teller opens a Branch Manager session
    Then the other session identifies the Branch Manager

  @auth-T
  Scenario: Teller and Manager use separate sessions
    Given the multi-user dashboard is open for a Teller
    When the Teller opens a Manager session
    Then the other session identifies the Manager
