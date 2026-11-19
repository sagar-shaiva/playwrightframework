@bdd @bdd03
Feature: Customer creation
  The Super User creates a new customer. The deposit and withdrawal features then use this customer.

  @auth-superUser
  Scenario: The Super User creates the new customer "retail"
    Given I am signed in as "superUser"
    When I create the new customer "retail"
    Then I see the new customer "retail" with a generated customer ID
    And I see the new customer "retail" saved in the database
