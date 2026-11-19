@bdd @bdd99
Feature: Branch closing
  The Super User closes the branch after all teller work has finished.

  @pomSetup
  @auth-superUser
  Scenario: The Super User closes the branch
    Given I am signed in as "superUser"
    When I close the branch
    Then I see the branch is closed
