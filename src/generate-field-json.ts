/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
import { spawn } from "node:child_process";

export interface FormField {
  fieldDefault: string;
  fieldFlags: string;
  fieldMaxLength: string | number;
  fieldOptions: string[];
  fieldType: string;
  fieldValue: string | boolean;
  title: string;
}

const getFieldOptions = (field: string): string[] => {
  const regOptions = /FieldStateOption: [^\n]*/g;
  const matches = field.match(regOptions);
  const options: string[] = [];
  if (matches) {
    for (const match of matches) {
      options.push(/FieldStateOption: ([^\n]*)/.exec(match)?.[1]?.trim()!);
    }
  }
  // eslint-disable-next-line etc/no-assign-mutated-array
  return options.sort();
};

/**
 * Extracts the Form Fields from a PDF Form
 * @param sourceFile
 * @returns A FormField object
 */
export default (sourceFile: string): Promise<FormField[]> => {
  const regName = /FieldName: ([^\n]*)/;
  const regType = /FieldType: ([\t .A-Za-z]+)/;
  const regFlags = /FieldFlags: ([\d\t .]+)/;
  const regMaxLength = /FieldMaxLength: ([\d\t .]+)/;
  const regValue = /FieldValue: ([^\n]*)/;
  const regDefault = /FieldValueDefault: ([^\n]*)/;
  const regOptions = /FieldStateOption: [^\n]*/g;
  const fieldArray: FormField[] = [];

  return new Promise((resolve, reject) => {
    const childProcess = spawn("pdftk", [sourceFile, "dump_data_fields_utf8"]);
    let output = "";

    childProcess.on("error", (error) => reject(error));
    childProcess.stdout.on("error", (error) => reject(error));
    childProcess.stderr.on("error", (error) => reject(error));
    childProcess.stdin.on("error", (error) => reject(error));

    childProcess.stdout.on("data", (data) => {
      output += data;
    });

    childProcess.stdout.on("end", () => {
      const fields = output.split("---").slice(1);
      for (const field of fields) {
        fieldArray.push({
          fieldDefault: regDefault.exec(field)?.[1]?.trim()! ?? "",
          fieldFlags: regFlags.exec(field)?.[1]?.trim()! ?? "",
          fieldMaxLength: regMaxLength.exec(field)?.[1]?.trim()! ?? "",
          fieldOptions: regOptions.test(field) ? getFieldOptions(field) : [],
          fieldType: regType.exec(field)?.[1]?.trim()! ?? "",
          fieldValue: regValue.exec(field)?.[1]?.trim()! ?? "",
          title: regName.exec(field)?.[1]?.trim()! ?? "",
        });
      }
      resolve(fieldArray);
    });
  });
};
