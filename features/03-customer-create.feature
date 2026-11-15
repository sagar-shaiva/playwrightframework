@bdd @bdd03
Feature: Create a customer

  @auth-SU
  Scenario: Super User creates a customer for the transaction workflow
    Given the Super User session is active
    When the Super User creates the configured customer
    Then the new customer is saved for later BDD scenarios
    And the customer is stored in the database when available
