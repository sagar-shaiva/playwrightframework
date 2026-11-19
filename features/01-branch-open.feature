@bdd @bdd01
Feature: Branch opening
  The Super User opens the branch before any teller work starts.
  Quoted names such as "superUser" are keys in the test data file.

  @noauth
  Scenario: The Super User opens the branch
    Given I am on the login form
    And I sign in as "superUser"
    And I am authenticated as "superUser"
    When I open the branch
    Then I see the branch is open
