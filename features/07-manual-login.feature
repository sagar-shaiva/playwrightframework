@bdd @bdd07
Feature: Manual sign-in

  @noauth
  Scenario: Teller signs in successfully
    Given the login form is displayed
    When I sign in as the Teller
    Then I am authenticated as the Teller

  @noauth
  Scenario: Branch Manager signs in successfully
    Given the login form is displayed
    When I sign in as the Branch Manager
    Then I am authenticated as the Branch Manager

  @noauth
  Scenario: Teller can sign out
    Given the login form is displayed
    When I sign in as the Teller and then sign out
    Then the login form is displayed again

  @noauth
  Scenario: An incorrect password is rejected
    Given the login form is displayed
    When I submit an incorrect password as the Teller
    Then the invalid password message is displayed
