@bdd @bdd07
Feature: Manual sign-in
  Users sign in from the login form. Quoted names are keys in the test data file.

  @noauth
  Scenario Outline: "<role>" signs in from the login form
    Given I am on the login form
    And I take a screenshot "01.loginpage"
    When I sign in as "<role>"
    Then I am authenticated as "<role>"
    And I take a screenshot "02.dashboardpage"

    Examples:
      | role          |
      | teller        |
      | branchManager |

  @noauth
  Scenario: The Teller signs out and returns to the login form
    Given I am on the login form
    And I sign in as "teller"
    And I am authenticated as "teller"
    When I sign out
    Then I am on the login form
    And I take a screenshot "02.loginpage-after-logout"

  @noauth
  Scenario: A wrong password is rejected
    Given I am on the login form
    When I sign in as "teller" with password "wrongPassword"
    Then I see the login error "invalidPassword"
    And I take a screenshot "02.invalid-password-error"
