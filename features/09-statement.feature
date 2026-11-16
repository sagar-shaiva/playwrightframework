@bdd @bdd09
Feature: Customer statements

  @auth-T
  Scenario: Customer statement opens as a PDF in the same browser context
    Given the configured customer is selected and statement actions are available
    When I open the customer's statement
    Then the statement is a PDF in the same browser context

  @auth-T
  Scenario: Customer statement can be downloaded
    Given the configured customer is selected and statement actions are available
    When I download the customer's statement
    Then the downloaded file is a PDF

  @auth-T
  Scenario: Print to PDF opens a PDF in a new page
    Given the configured customer is selected and statement actions are available
    When I open Print to PDF
    Then the print-to-PDF response is a PDF in the same context

  @auth-T
  Scenario: The print preview can be saved as a PDF
    Given the configured customer is selected and statement actions are available
    When I open the print preview
    Then the print preview is saved as a PDF

  @auth-T
  Scenario: The print preview can be saved without closing the page
    Given the configured customer is selected and statement actions are available
    When I open the print preview without automatic closing
    Then the print preview is saved as a PDF
