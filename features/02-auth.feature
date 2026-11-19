@bdd @bdd02
Feature: User sessions
  Every user signs in once and the session is saved, so later features start already signed in.

  @noauth
  Scenario Outline: "<role>" signs in and the session is saved
    Given I am on the login form
    When I sign in as "<role>"
    Then I am authenticated as "<role>"
    And I save the session of "<role>"

    Examples:
      | role             |
      | superUser        |
      | branchManager    |
      | branchSupervisor |
      | backOffice       |
      | enquiry          |
      | loanOfficer      |
      | loanManager      |
      | manager          |
      | teller           |
