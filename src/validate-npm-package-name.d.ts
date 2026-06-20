declare module "validate-npm-package-name" {
  interface ValidateResult {
    validForNewPackages: boolean;
    validForOldPackages: boolean;
    errors?: string[];
    warnings?: string[];
  }

  export default function validate(
    name: string,
  ): ValidateResult;
}
