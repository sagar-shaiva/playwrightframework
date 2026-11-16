@bdd @bdd10
Feature: Customer lookup

  @auth-T
  Scenario: Teller finds an existing retail customer
    Given I am signed in as the Teller
    When I search for the configured retail customer
    Then the retail customer's details and balance are displayed

  @auth-T
  Scenario: Teller finds an existing corporate customer
    Given I am signed in as the Teller
    When I search for the configured corporate customer
    Then the corporate customer's details and balance are displayed

  @auth-T
  Scenario: An unknown customer cannot be found
    Given I am signed in as the Teller
    When I search for an unknown customer
    Then the customer not found message is displayed
