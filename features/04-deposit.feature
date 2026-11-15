@bdd @bdd04
Feature: Deposit money into a customer account

  @auth-T
  Scenario: Teller deposits into the customer created by BDD
    Given the Teller session is active
    When the Teller deposits the configured amount into the BDD customer
    Then the customer balance includes the deposit
    And the deposit is stored in the database when available

  @auth-T
  Scenario: Teller increases the account balance with a deposit
    Given the Teller session is active
    When the Teller prepares the deposit form for an existing customer
    Then the configured deposit increases the balance

  @auth-T
  Scenario: Deposit requires a selected customer
    Given the Teller session is active
    When the Teller submits a deposit without selecting a customer
    Then the customer selection error is shown

  @auth-T
  Scenario: Teller sees only configured deposit reasons
    Given the Teller session is active
    When the Teller opens deposit reasons for a known customer
    Then only configured deposit reasons are available

  @auth-T
  Scenario: Teller can deposit a decimal amount
    Given the Teller session is active
    When the Teller deposits the configured decimal amount
    Then the balance increases by the decimal deposit amount

  @auth-T
  Scenario: Teller accepts the first configured deposit reason
    Given the Teller session is active
    When the Teller prepares the deposit form for an existing customer
    Then the first configured deposit reason is accepted

  @auth-T
  Scenario: Teller accepts the second configured deposit reason
    Given the Teller session is active
    When the Teller prepares the deposit form for an existing customer
    Then the second configured deposit reason is accepted

  @auth-T
  Scenario: Teller accepts the third configured deposit reason
    Given the Teller session is active
    When the Teller prepares the deposit form for an existing customer
    Then the third configured deposit reason is accepted

  @auth-T
  Scenario: Teller accepts the fourth configured deposit reason
    Given the Teller session is active
    When the Teller prepares the deposit form for an existing customer
    Then the fourth configured deposit reason is accepted

  @auth-T
  Scenario: Teller accepts the fifth configured deposit reason
    Given the Teller session is active
    When the Teller prepares the deposit form for an existing customer
    Then the fifth configured deposit reason is accepted

  @auth-T
  Scenario: Teller rejects the first configured invalid deposit amount
    Given the Teller session is active
    When the Teller prepares the deposit form for an existing customer
    Then the first configured invalid deposit amount is rejected

  @auth-T
  Scenario: Teller rejects the second configured invalid deposit amount
    Given the Teller session is active
    When the Teller prepares the deposit form for an existing customer
    Then the second configured invalid deposit amount is rejected

  @auth-BM
  Scenario: A non-Teller cannot submit a deposit
    Given the Branch Manager session is active
    When a Branch Manager opens the deposit page
    Then the transaction is blocked for a non-Teller
