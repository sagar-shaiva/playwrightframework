@bdd @bdd09
Feature: Customer statements
  A Teller views, downloads and prints a customer's statement as a PDF.

  @auth-teller
  Scenario: The statement of customer "retail" opens as a PDF in the same browser context
    Given I am signed in as "teller"
    And I have the "retail" customer selected with statement actions available
    When I open the statement of customer "retail"
    Then I see the statement as a PDF in the same browser context

  @auth-teller
  Scenario: The statement of customer "retail" can be downloaded
    Given I am signed in as "teller"
    And I have the "retail" customer selected with statement actions available
    When I download the statement
    Then I see the downloaded file is a PDF named after customer "retail"

  @auth-teller
  Scenario: Print to PDF for customer "retail" opens a PDF in a new page
    Given I am signed in as "teller"
    And I have the "retail" customer selected with statement actions available
    When I open Print to PDF for customer "retail"
    Then I see the print-to-PDF response as a PDF in the same browser context

  @auth-teller
  Scenario: The print preview for customer "retail" can be saved as a PDF
    Given I am signed in as "teller"
    And I have the "retail" customer selected with statement actions available
    When I open the print preview for customer "retail"
    Then I see the print preview saved as a PDF

  @auth-teller
  Scenario: The print preview for customer "retail" can be saved without closing the page
    Given I am signed in as "teller"
    And I have the "retail" customer selected with statement actions available
    When I open the print preview without automatic closing for customer "retail"
    Then I see the print preview saved as a PDF
