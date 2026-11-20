@bdd @bdd05
Feature: Customer withdrawals
  A Teller withdraws money from a customer's account.
  Quoted names are keys in the test data file, for example "standard" under "withdrawals".
  Database checks run only when database credentials are configured for the environment.

  @auth-teller
  Scenario: The Teller withdraws from the new customer "retail"
    Given I am signed in as "teller"
    And I open the new customer "retail" on the transaction page
    When I withdraw "cash"
    Then I see the success message "transactionSuccess"
    And I see the new customer "retail" balance after deposit "salary" and withdrawal "cash"
    And I see withdrawal "cash" saved in the database

  @auth-teller
  Scenario Outline: The Teller withdraws "<withdrawal>" from customer "<customer>"
    Given I am signed in as "teller"
    And I open customer "<customer>" on the transaction page
    When I withdraw "<withdrawal>"
    Then I see the success message "transactionSuccess"
    And I see the balance of customer "<customer>" reduced by withdrawal "<withdrawal>"

    Examples:
      | customer  | withdrawal |
      | retail    | standard   |
      | corporate | standard   |

  @auth-teller
  Scenario: The Teller withdraws the full balance of customer "retail"
    Given I am signed in as "teller"
    And I open customer "retail" on the transaction page
    When I withdraw the full balance of customer "retail"
    Then I see the success message "transactionSuccess"
    And I see the balance is zero

  @auth-teller
  Scenario Outline: The Teller withdraws using reason "<reason>"
    Given I am signed in as "teller"
    And I open customer "retail" on the transaction page
    When I withdraw "standard" with reason "<reason>"
    Then I see the success message "transactionSuccess"
    And I see withdrawal reason "<reason>" selected

    Examples:
      | reason        |
      | cash          |
      | billPayment   |
      | transferSent  |
      | serviceFee    |
      | loanRepayment |

  @auth-teller
  Scenario: Only withdrawal reasons are offered for a withdrawal
    Given I am signed in as "teller"
    And I open customer "retail" on the transaction page
    When I choose the withdrawal transaction type
    Then I see only the withdrawal reasons offered

  @auth-teller
  Scenario: A withdrawal far above the balance is rejected
    Given I am signed in as "teller"
    And I open customer "retail" on the transaction page
    When I withdraw "farAboveBalance"
    Then I see the transaction error "insufficientFunds"

  @auth-teller
  Scenario Outline: A withdrawal "<excess>" above the balance is rejected
    Given I am signed in as "teller"
    And I open customer "retail" on the transaction page
    When I withdraw "<excess>" more than the balance of customer "retail"
    Then I see the transaction error "insufficientFunds"

    Examples:
      | excess  |
      | oneCent |

  @auth-teller
  Scenario Outline: A withdrawal of invalid amount "<invalidAmount>" is rejected
    Given I am signed in as "teller"
    And I open customer "retail" on the transaction page
    When I withdraw invalid amount "<invalidAmount>"
    Then I see the transaction error "invalidAmount"

    Examples:
      | invalidAmount |
      | zero          |
      | negative      |

  @auth-teller
  Scenario: A withdrawal without a selected customer is rejected
    Given I am signed in as "teller"
    And I open the transaction page
    When I withdraw "standard"
    Then I see the transaction error "customerNotSelected"
