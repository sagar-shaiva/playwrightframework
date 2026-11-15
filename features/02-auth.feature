@bdd @bdd02
Feature: Authenticate configured teller users

  @noauth
  @login-SU
  Scenario: Save Super User session
    When the configured user signs in and saves their session

  @noauth
  @login-BM
  Scenario: Save Branch Manager session
    When the configured user signs in and saves their session

  @noauth
  @login-BS
  Scenario: Save Branch Supervisor session
    When the configured user signs in and saves their session

  @noauth
  @login-BO
  Scenario: Save Back Office session
    When the configured user signs in and saves their session

  @noauth
  @login-E
  Scenario: Save Enquiry session
    When the configured user signs in and saves their session

  @noauth
  @login-L
  Scenario: Save Loan Officer session
    When the configured user signs in and saves their session

  @noauth
  @login-LM
  Scenario: Save Loan Manager session
    When the configured user signs in and saves their session

  @noauth
  @login-MG
  Scenario: Save Manager session
    When the configured user signs in and saves their session

  @noauth
  @login-T
  Scenario: Save Teller session
    When the configured user signs in and saves their session
