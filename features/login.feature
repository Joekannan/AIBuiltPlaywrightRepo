Feature: Login

  # Background runs before EVERY scenario in this feature file.
  # It is the BDD equivalent of test.beforeEach().
  Background:
    Given I am on the login page

  @smoke
  Scenario: Successful login with valid credentials
    When I enter username "standard_user" and password "secret_sauce"
    And I click the login button
    Then I should be on the inventory page
    And I should see the "Products" heading

  @regression
  Scenario: Login fails with invalid password
    When I enter username "standard_user" and password "wrong_password"
    And I click the login button
    Then I should see an error message containing "Username and password do not match"

  @regression
  Scenario: Login fails with locked out user
    When I enter username "locked_out_user" and password "secret_sauce"
    And I click the login button
    Then I should see an error message containing "locked out"

  @regression
  Scenario: Login fails when username is empty
    When I enter username "" and password "secret_sauce"
    And I click the login button
    Then I should see an error message containing "Username is required"

  @regression
  Scenario: Login fails when password is empty
    When I enter username "standard_user" and password ""
    And I click the login button
    Then I should see an error message containing "Password is required"
