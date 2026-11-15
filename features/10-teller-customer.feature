@bdd @bdd10
Feature: Find teller customers

  @auth-T
  Scenario: Teller finds an existing retail customer
    Given the customer lookup dashboard is open for a Teller
    When the Teller searches for the configured retail customer
    Then the retail customer and balance are shown

  @auth-T
  Scenario: Teller finds an existing corporate customer
    Given the customer lookup dashboard is open for a Teller
    When the Teller searches for the configured corporate customer
    Then the corporate customer and balance are shown

  @auth-T
  Scenario: Unknown customer is not found
    Given the customer lookup dashboard is open for a Teller
    When the Teller searches for an unknown customer
    Then the customer not found message is shown
