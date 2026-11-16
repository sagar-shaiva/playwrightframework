@bdd @bdd05
Feature: Customer withdrawals

  @auth-T
  Scenario: Teller withdraws from the customer created in this workflow
    Given I am signed in as the Teller
    When I withdraw the configured amount from the customer created in this workflow
    Then the customer's balance reflects the withdrawal
    And the withdrawal is saved in the database when database checks are enabled

  @auth-T
  Scenario: A configured withdrawal updates the customer's balance
    Given I am signed in as the Teller
    When I prepare a withdrawal from an existing customer
    Then the configured withdrawal completes and the expected balance is displayed

  @auth-T
  Scenario: A customer must be selected before making a withdrawal
    Given I am signed in as the Teller
    When I submit a withdrawal without selecting a customer
    Then the customer selection error is displayed

  @auth-T
  Scenario: Only configured withdrawal reasons are available
    Given I am signed in as the Teller
    When I view the withdrawal reasons for a known customer
    Then the available reasons match the configured withdrawal reasons

  @auth-T
  Scenario: Teller can use the first configured withdrawal reason
    Given I am signed in as the Teller
    When I prepare a withdrawal from an existing customer
    Then the first configured withdrawal reason is accepted

  @auth-T
  Scenario: Teller can use the second configured withdrawal reason
    Given I am signed in as the Teller
    When I prepare a withdrawal from an existing customer
    Then the second configured withdrawal reason is accepted

  @auth-T
  Scenario: Teller can use the third configured withdrawal reason
    Given I am signed in as the Teller
    When I prepare a withdrawal from an existing customer
    Then the third configured withdrawal reason is accepted

  @auth-T
  Scenario: Teller can use the fourth configured withdrawal reason
    Given I am signed in as the Teller
    When I prepare a withdrawal from an existing customer
    Then the fourth configured withdrawal reason is accepted

  @auth-T
  Scenario: Teller can use the fifth configured withdrawal reason
    Given I am signed in as the Teller
    When I prepare a withdrawal from an existing customer
    Then the fifth configured withdrawal reason is accepted

  @auth-T
  Scenario: The first configured invalid withdrawal amount is rejected
    Given I am signed in as the Teller
    When I prepare the withdrawal form for amount checks
    Then the first configured invalid withdrawal amount is rejected

  @auth-T
  Scenario: The second configured invalid withdrawal amount is rejected
    Given I am signed in as the Teller
    When I prepare the withdrawal form for amount checks
    Then the second configured invalid withdrawal amount is rejected

  @auth-T
  Scenario: A withdrawal above the available balance is rejected
    Given I am signed in as the Teller
    When I submit a withdrawal above the available balance
    Then an insufficient funds message is displayed

  @auth-T
  Scenario: A withdrawal one cent above the balance is rejected
    Given I am signed in as the Teller
    When I submit a withdrawal one cent above the available balance
    Then an insufficient funds message is displayed

  @auth-T
  Scenario: Teller can withdraw the full available balance
    Given I am signed in as the Teller
    When I withdraw the available balance
    Then the remaining balance is zero
