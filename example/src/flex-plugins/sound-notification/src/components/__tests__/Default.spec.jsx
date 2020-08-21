import React from 'react';
import { shallow } from 'enzyme';

describe('Default Testing', () => {
  it("Empty strings should match", () => {
    expect("").toMatch("");
  });
});
