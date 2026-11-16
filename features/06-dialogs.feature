@bdd @bdd06
Feature: Application dialogs

  @noauth
  Scenario: An invalid password displays an error dialog
    Given the login form is displayed
    When I submit an invalid password
    Then the invalid password message is displayed

  @auth-T
  Scenario: A successful deposit displays a confirmation dialog
    Given I am signed in as the Teller
    When I complete a successful deposit
    Then the transaction success message is displayed

  @auth-T
  Scenario: An unexpected service failure is handled
    Given I am signed in as the Teller
    When the application displays a service failure
