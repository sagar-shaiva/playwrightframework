@bdd @bdd09
Feature: View and download customer statements

  @auth-T
  Scenario: Customer statement opens as a PDF in the same browser context
    Given statement actions are available for the configured customer
    When the Teller opens the customer statement
    Then the statement is a PDF in the same browser context

  @auth-T
  Scenario: Customer statement can be downloaded
    Given statement actions are available for the configured customer
    When the Teller downloads the customer statement
    Then the downloaded file is a PDF

  @auth-T
  Scenario: Print to PDF opens a PDF in a new page
    Given statement actions are available for the configured customer
    When the Teller opens Print to PDF
    Then the print-to-PDF response is a PDF in the same context

  @auth-T
  Scenario: Teller saves the printable page as PDF
    Given statement actions are available for the configured customer
    When the Teller opens the print preview
    Then the print preview is saved as a PDF

  @auth-T
  Scenario: Teller saves the printable page without closing it
    Given statement actions are available for the configured customer
    When the Teller opens the print preview without auto-close
    Then the print preview is saved as a PDF
