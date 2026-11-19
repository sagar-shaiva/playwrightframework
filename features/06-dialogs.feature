@bdd @bdd06
Feature: Application dialogs
  Every browser dialog is accepted automatically so the application never blocks.
  Dialogs that no step checks are listed in the test output as unexpected.

  @auth-teller
  Scenario: An unexpected service failure dialog is accepted
    Given I am signed in as "teller"
    When I trigger a service failure
    Then I see the application is still usable
