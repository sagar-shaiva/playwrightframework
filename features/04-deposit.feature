@bdd @bdd04
Feature: Customer deposits
  A Teller deposits money into a customer's account.
  Quoted names are keys in the test data file, for example "standard" under "deposits".
  Database checks run only when database credentials are configured for the environment.

  @auth-teller
  Scenario: The Teller deposits into the new customer "retail"
    Given I am signed in as "teller"
    And I open the new customer "retail" on the transaction page
    When I deposit "salary"
    Then I see the success message "transactionSuccess"
    And I see the new customer "retail" balance increased by deposit "salary"
    And I see deposit "salary" saved in the database for the new customer "retail"

  @auth-teller
  Scenario Outline: The Teller deposits "<deposit>" into customer "<customer>"
    Given I am signed in as "teller"
    And I open customer "<customer>" on the transaction page
    When I deposit "<deposit>"
    Then I see the success message "transactionSuccess"
    And I see the balance of customer "<customer>" increased by deposit "<deposit>"

    Examples:
      | customer  | deposit  |
      | retail    | standard |
      | retail    | decimal  |
      | corporate | standard |

  @auth-teller
  Scenario Outline: The Teller deposits using reason "<reason>"
    Given I am signed in as "teller"
    And I open customer "retail" on the transaction page
    When I deposit "standard" with reason "<reason>"
    Then I see the success message "transactionSuccess"
    And I see deposit reason "<reason>" selected

    Examples:
      | reason   |
      | cash     |
      | cheque   |
      | salary   |
      | transfer |
      | refund   |

  @auth-teller
  Scenario: Only deposit reasons are offered for a deposit
    Given I am signed in as "teller"
    And I open customer "retail" on the transaction page
    When I choose the deposit transaction type
    Then I see only the deposit reasons offered

  @auth-teller
  Scenario Outline: A deposit of invalid amount "<invalidAmount>" is rejected
    Given I am signed in as "teller"
    And I open customer "retail" on the transaction page
    When I deposit invalid amount "<invalidAmount>"
    Then I see the transaction error "invalidAmount"

    Examples:
      | invalidAmount |
      | zero          |
      | negative      |

  @auth-teller
  Scenario: A deposit without a selected customer is rejected
    Given I am signed in as "teller"
    And I open the transaction page
    When I deposit "standard"
    Then I see the transaction error "customerNotSelected"

  @auth-branchManager
  Scenario: A Branch Manager cannot post a deposit
    Given I am signed in as "branchManager"
    When I open the transaction page
    Then I see the transaction error "tellerOnly"
    And I see the submit button disabled
