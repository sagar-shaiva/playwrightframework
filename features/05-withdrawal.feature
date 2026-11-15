@bdd @bdd05
Feature: Withdraw money from a customer account

  @auth-T
  Scenario: Teller withdraws from the customer created by BDD
    Given the Teller session is active
    When the Teller withdraws the configured amount from the BDD customer
    Then the customer balance reflects the withdrawal
    And the withdrawal is stored in the database when available

  @auth-T
  Scenario: Teller decreases the account balance with a withdrawal
    Given the Teller session is active
    When the Teller prepares a withdrawal from an existing customer
    Then the configured withdrawal decreases the balance

  @auth-T
  Scenario: Withdrawal requires a selected customer
    Given the Teller session is active
    When the Teller submits a withdrawal without selecting a customer
    Then the customer selection error is shown

  @auth-T
  Scenario: Teller sees only configured withdrawal reasons
    Given the Teller session is active
    When the Teller opens withdrawal reasons for a known customer
    Then only configured withdrawal reasons are available

  @auth-T
  Scenario: Teller accepts the first configured withdrawal reason
    Given the Teller session is active
    When the Teller prepares a withdrawal from an existing customer
    Then the first configured withdrawal reason is accepted

  @auth-T
  Scenario: Teller accepts the second configured withdrawal reason
    Given the Teller session is active
    When the Teller prepares a withdrawal from an existing customer
    Then the second configured withdrawal reason is accepted

  @auth-T
  Scenario: Teller accepts the third configured withdrawal reason
    Given the Teller session is active
    When the Teller prepares a withdrawal from an existing customer
    Then the third configured withdrawal reason is accepted

  @auth-T
  Scenario: Teller accepts the fourth configured withdrawal reason
    Given the Teller session is active
    When the Teller prepares a withdrawal from an existing customer
    Then the fourth configured withdrawal reason is accepted

  @auth-T
  Scenario: Teller accepts the fifth configured withdrawal reason
    Given the Teller session is active
    When the Teller prepares a withdrawal from an existing customer
    Then the fifth configured withdrawal reason is accepted

  @auth-T
  Scenario: Teller rejects the first configured invalid withdrawal amount
    Given the Teller session is active
    When the Teller prepares a withdrawal from an existing customer
    Then the first configured invalid withdrawal amount is rejected

  @auth-T
  Scenario: Teller rejects the second configured invalid withdrawal amount
    Given the Teller session is active
    When the Teller prepares a withdrawal from an existing customer
    Then the second configured invalid withdrawal amount is rejected

  @auth-T
  Scenario: Withdrawal above the available balance is rejected
    Given the Teller session is active
    When the Teller submits a withdrawal above the balance
    Then the insufficient funds message is shown

  @auth-T
  Scenario: Withdrawal one cent above the balance is rejected
    Given the Teller session is active
    When the Teller submits a withdrawal one cent above the balance
    Then the insufficient funds message is shown

  @auth-T
  Scenario: Teller can withdraw the full balance
    Given the Teller session is active
    When the Teller withdraws the available balance
    Then the remaining balance is zero
