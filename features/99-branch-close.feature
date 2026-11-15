@bdd @bdd99
Feature: Close the branch after teller workflows

  @pomSetup
  @auth-SU
  Scenario: Super User closes the branch
    Given the Super User session is active
    When the Super User closes the branch
    Then the branch status is closed
