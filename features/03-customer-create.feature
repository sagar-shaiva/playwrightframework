@bdd @bdd03
Feature: Customer creation

  @auth-SU
  Scenario: Super User creates a customer for later transactions
    Given I am signed in as the Super User
    When I create the configured customer
    Then the customer is available to later BDD scenarios
    And the customer is saved in the database when database checks are enabled
