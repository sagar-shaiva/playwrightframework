@bdd @bdd02
Feature: User authentication

  @noauth
  @login-SU
  Scenario: Super User signs in successfully
    When the configured user signs in and their session is saved

  @noauth
  @login-BM
  Scenario: Branch Manager signs in successfully
    When the configured user signs in and their session is saved

  @noauth
  @login-BS
  Scenario: Branch Supervisor signs in successfully
    When the configured user signs in and their session is saved

  @noauth
  @login-BO
  Scenario: Back Office user signs in successfully
    When the configured user signs in and their session is saved

  @noauth
  @login-E
  Scenario: Enquiry user signs in successfully
    When the configured user signs in and their session is saved

  @noauth
  @login-L
  Scenario: Loan Officer signs in successfully
    When the configured user signs in and their session is saved

  @noauth
  @login-LM
  Scenario: Loan Manager signs in successfully
    When the configured user signs in and their session is saved

  @noauth
  @login-MG
  Scenario: Manager signs in successfully
    When the configured user signs in and their session is saved

  @noauth
  @login-T
  Scenario: Teller signs in successfully
    When the configured user signs in and their session is saved
