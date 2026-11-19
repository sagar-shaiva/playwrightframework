@bdd @bdd10
Feature: Customer lookup
  A Teller searches for customers by ID. Quoted names are keys in the test data file.

  @auth-teller
  Scenario Outline: The Teller finds customer "<customer>"
    Given I am signed in as "teller"
    When I search for customer "<customer>"
    Then I see the name and balance of customer "<customer>"

    Examples:
      | customer  |
      | retail    |
      | corporate |

  @auth-teller
  Scenario Outline: The Teller cannot find unknown customer "<unknownCustomer>"
    Given I am signed in as "teller"
    When I search for unknown customer "<unknownCustomer>"
    Then I see the customer error "customerNotFound"

    Examples:
      | unknownCustomer |
      | notRegistered   |
