@bdd @bdd06
Feature: Handle application dialogs

  @noauth
  Scenario: Invalid password dialog is accepted and reported
    Given the dialog login form is open
    When the user submits an invalid password
    Then the invalid password message is shown

  @auth-T
  Scenario: Successful transaction dialog is accepted and reported
    Given the Teller session is active
    When the Teller completes a successful deposit
    Then the transaction success message is shown

  @auth-T
  Scenario: Unexpected service failure is reported
    Given the Teller session is active
    When the application reports a service failure
    Then the BDD scenario completes with the dialog handled
