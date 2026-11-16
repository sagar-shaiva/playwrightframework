@bdd @bdd99
Feature: Branch management

  @pomSetup
  @auth-SU
  Scenario: Super User closes the branch after teller workflows
    Given I am signed in as the Super User
    When I close the branch
    Then the branch is closed
