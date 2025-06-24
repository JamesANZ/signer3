# signer3
MultiSig arbitrator solution for bitcoin collateral.

## The problem
Many bitcoin collateralised loan providers require the borrower to give up full custody of their funds to the lender. This opens up the borrower and lender to a variety of risks such as security hacks, fraud and insolvency risk. While many bitcoiners are open to the idea of using their bitcoin as collateral for loans, few are willing to subject their coins to such risk and are therefore reluctant to use such services. 

## The solution
Signer3 aims to resolve this issue by acting as a neutral third party and signatory in a bitcoin multisig used to hold funds as collateral. Using a 2 of 3 multisig as an example (with the borrower, lender and signer3 each holding a key), here's how a typical flow would look:

1. The borrower deposits funds into the multisig
2. When the borrower and lender agree, both parties co sign the transaction (without Signer3)
3. When the borrower and lender disagree, both parties go to court or a tribunal
4. Signer3 steps in an co signers a transaction based on the outcome of the court dispute, using either the borrower or lenders key
5. If either the borrower or lender lose access to their key or are compromised, signer3 can recover the funds with the functional signatory

This example scenario can be expanded to include more signatories or a different threshold of required signatures. 

## Additional services

### Timelock recover
Signer3 can also be configured as a recovery signer, an example of how this could look is detailed below:

1. Signer3's key is set to be a valid signer after a certain CSV timelock condition is met
2. If both the lender and borrower lose access to their keys, Signer3 can recover the funds after the timelock condition is met
