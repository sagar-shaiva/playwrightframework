@bdd @bdd04
Feature: Customer deposits

  @auth-T
  Scenario: Teller deposits into the customer created in this workflow
    Given I am signed in as the Teller
    When I deposit the configured amount into the customer created in this workflow
    Then the customer's balance reflects the deposit
    And the deposit is saved in the database when database checks are enabled

  @auth-T
  Scenario: A configured deposit updates the customer's balance
    Given I am signed in as the Teller
    When I prepare a deposit for an existing customer
    Then the configured deposit completes and the expected balance is displayed

  @auth-T
  Scenario: A customer must be selected before making a deposit
    Given I am signed in as the Teller
    When I submit a deposit without selecting a customer
    Then the customer selection error is displayed

  @auth-T
  Scenario: Only configured deposit reasons are available
    Given I am signed in as the Teller
    When I view the deposit reasons for a known customer
    Then the available reasons match the configured deposit reasons

  @auth-T
  Scenario: A decimal deposit updates the customer's balance
    Given I am signed in as the Teller
    When I deposit the configured decimal amount
    Then the customer's balance reflects the decimal deposit

  @auth-T
  Scenario: Teller can use the first configured deposit reason
    Given I am signed in as the Teller
    When I prepare a deposit for an existing customer
    Then the first configured deposit reason is accepted

  @auth-T
  Scenario: Teller can use the second configured deposit reason
    Given I am signed in as the Teller
    When I prepare a deposit for an existing customer
    Then the second configured deposit reason is accepted

  @auth-T
  Scenario: Teller can use the third configured deposit reason
    Given I am signed in as the Teller
    When I prepare a deposit for an existing customer
    Then the third configured deposit reason is accepted

  @auth-T
  Scenario: Teller can use the fourth configured deposit reason
    Given I am signed in as the Teller
    When I prepare a deposit for an existing customer
    Then the fourth configured deposit reason is accepted

  @auth-T
  Scenario: Teller can use the fifth configured deposit reason
    Given I am signed in as the Teller
    When I prepare a deposit for an existing customer
    Then the fifth configured deposit reason is accepted

  @auth-T
  Scenario: The first configured invalid deposit amount is rejected
    Given I am signed in as the Teller
    When I prepare the deposit form for amount checks
    Then the first configured invalid deposit amount is rejected

  @auth-T
  Scenario: The second configured invalid deposit amount is rejected
    Given I am signed in as the Teller
    When I prepare the deposit form for amount checks
    Then the second configured invalid deposit amount is rejected

  @auth-BM
  Scenario: A Branch Manager cannot submit a deposit
    Given I am signed in as the Branch Manager
    When a Branch Manager attempts to open the deposit page
    Then the application prevents the transaction
