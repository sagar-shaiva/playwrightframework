@bdd @bdd01
Feature: Branch management

  @noauth
  Scenario: A Super User opens the branch
    Given the Super User is signed in
    When the Super User opens the branch
    Then the branch is open
