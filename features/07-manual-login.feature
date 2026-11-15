@bdd @bdd07
Feature: Manually sign in to the teller portal

  @noauth
  Scenario: Teller logs in manually
    Given the manual login form is open
    When the Teller logs in manually
    Then the Teller dashboard is shown

  @noauth
  Scenario: Branch Manager logs in manually
    Given the manual login form is open
    When the Branch Manager logs in manually
    Then the Branch Manager dashboard is shown

  @noauth
  Scenario: Teller can sign out
    Given the manual login form is open
    When the Teller signs in and signs out
    Then the login form is available again

  @noauth
  Scenario: Incorrect password is rejected
    Given the manual login form is open
    When the Teller submits an incorrect password
    Then the invalid password message is shown
