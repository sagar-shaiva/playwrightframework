@bdd @bdd08
Feature: Multiple user sessions
  Two users work at the same time in separate browser sessions.

  @auth-teller
  Scenario Outline: "teller" and "<otherRole>" work in separate sessions
    Given I am signed in as "teller"
    When I open a second session as "<otherRole>"
    Then I see the second session signed in as "<otherRole>"

    Examples:
      | otherRole     |
      | branchManager |
      | manager       |
