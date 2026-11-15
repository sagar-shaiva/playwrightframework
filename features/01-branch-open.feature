@bdd @bdd01
Feature: Open the branch before teller workflows

  @noauth
  Scenario: Super User opens the branch
    Given the Super User signs in
    When the Super User opens the branch
    Then the branch status is open
