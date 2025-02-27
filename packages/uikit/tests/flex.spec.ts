import { expect } from "chai";
import {
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  ALIGN_SPACE_AROUND,
  DISPLAY_NONE,
  EDGE_BOTTOM,
  EDGE_LEFT,
  EDGE_RIGHT,
  FLEX_DIRECTION_ROW_REVERSE,
  JUSTIFY_SPACE_EVENLY,
  Node,
  OVERFLOW_SCROLL,
  POSITION_TYPE_ABSOLUTE,
  UNIT_PERCENT,
  UNIT_POINT,
  WRAP_WRAP_REVERSE,
  Yoga,
} from "yoga-wasm-web";
import { EDGE_TOP } from "yoga-wasm-web";
import {
  FlexNode,
  YogaProperties,
  loadYogaBase64,
  setMeasureFunc,
  setter,
} from "../src/flex/index.js";
import { signal } from "@preact/signals-core";

const testValues: YogaProperties = {
  alignContent: "center",
  alignItems: "flex-end",
  alignSelf: "space-around",
  aspectRatio: 2,
  borderBottom: 3,
  borderLeft: 4,
  borderRight: 5,
  borderTop: 6,
  display: "none",
  flexBasis: 7,
  flexDirection: "row-reverse",
  flexGrow: 8,
  flexShrink: 9,
  flexWrap: "wrap-reverse",
  height: 10,
  justifyContent: "space-evenly",
  marginBottom: 11,
  marginLeft: 12,
  marginRight: 13,
  marginTop: 14,
  maxHeight: 15,
  maxWidth: 16,
  minHeight: 17,
  minWidth: 18,
  overflow: "scroll",
  paddingBottom: 19,
  paddingLeft: 20,
  paddingRight: 21,
  paddingTop: 22,
  positionBottom: 23,
  positionLeft: 24,
  positionRight: 25,
  positionTop: 26,
  positionType: "absolute",
  width: "50%",
};

export const rawTestValues = {
  alignContent: ALIGN_CENTER,
  alignItems: ALIGN_FLEX_END,
  alignSelf: ALIGN_SPACE_AROUND,
  aspectRatio: 2,
  borderBottom: 3,
  borderLeft: 4,
  borderRight: 5,
  borderTop: 6,
  display: DISPLAY_NONE,
  flexBasis: 7,
  flexDirection: FLEX_DIRECTION_ROW_REVERSE,
  flexGrow: 8,
  flexShrink: 9,
  flexWrap: WRAP_WRAP_REVERSE,
  height: 10,
  justifyContent: JUSTIFY_SPACE_EVENLY,
  marginBottom: 11,
  marginLeft: 12,
  marginRight: 13,
  marginTop: 14,
  maxHeight: 15,
  maxWidth: 16,
  minHeight: 17,
  minWidth: 18,
  overflow: OVERFLOW_SCROLL,
  paddingBottom: 19,
  paddingLeft: 20,
  paddingRight: 21,
  paddingTop: 22,
  positionBottom: 23,
  positionLeft: 24,
  positionRight: 25,
  positionTop: 26,
  positionType: POSITION_TYPE_ABSOLUTE,
  width: 50, //50%
};

const properties = Object.keys(testValues) as Array<keyof typeof testValues>;

const propertiesWithEdge = ["border", "padding", "margin", "position"] as const;

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getRawValue(property: string, node: Node): any {
  for (const propertyWithEdge of propertiesWithEdge) {
    if (property.startsWith(propertyWithEdge)) {
      if (property.endsWith("Top")) {
        return flatten(node[`get${capitalize(property.slice(0, -3))}` as "getBorder"](EDGE_TOP));
      }
      if (property.endsWith("Bottom")) {
        return flatten(node[`get${capitalize(property.slice(0, -6))}` as "getBorder"](EDGE_BOTTOM));
      }
      if (property.endsWith("Right")) {
        return flatten(node[`get${capitalize(property.slice(0, -5))}` as "getBorder"](EDGE_RIGHT));
      }
      if (property.endsWith("Left")) {
        return flatten(node[`get${capitalize(property.slice(0, -4))}` as "getBorder"](EDGE_LEFT));
      }
    }
  }
  return flatten(node[`get${capitalize(property)}` as "getWidth"]());
}

describe("set & get properties", () => {
  let yoga: any;
  let node: Node;

  const rawValues: any = {};

  before(async () => {
    yoga = await loadYogaBase64().catch(console.error);
    node = yoga.Node.create();
  });

  it("it should throw an error", () => {
    expect(
      () => setter.alignItems(node, 1, "centerx" as any),
      "assign alignItems a unknown value",
    ).to.throw(
      `unexpected value centerx, expected auto, flex-start, center, flex-end, stretch, baseline, space-between, space-around`,
    );

    expect(
      () => setter.alignItems(node, 1, 1 as any),
      "assign alignItems a wrong value type",
    ).to.throw(
      `unexpected value 1, expected auto, flex-start, center, flex-end, stretch, baseline, space-between, space-around`,
    );
  });

  it("should get raw vaues", () => {
    properties.forEach((property) => {
      rawValues[property] = getRawValue(property, node);
    });
  });

  it("it should set new values", () => {
    (Object.entries(testValues) as Array<[keyof YogaProperties, any]>).forEach(([name, value]) =>
      setter[name](node, 1, value),
    );
    properties.forEach((property) =>
      expect(getRawValue(property, node), `compare ${property} to expected value`).to.equal(
        rawTestValues[property as any as keyof typeof rawTestValues],
      ),
    );
  });

  it("it should reset all values", () => {
    (Object.keys(testValues) as Array<keyof YogaProperties>).forEach((name) =>
      setter[name](node, 1, undefined),
    );
    properties.forEach((property) => {
      expect(
        equal(getRawValue(property, node), rawValues[property]),
        `compare ${property} to the default value`,
      ).to.be.true;
    });
  });

  it("it should set value with and without precision", () => {
    setter.width(node, 0.01, 1);
    expect(node.getWidth()).to.deep.equal({
      unit: UNIT_POINT,
      value: 100,
    });
    setter.width(node, 0.01, "50%");
    expect(node.getWidth()).to.deep.equal({
      unit: UNIT_PERCENT,
      value: 50,
    });
  });

  it("it should set and unset measure func", () => {
    expect(() => {
      setMeasureFunc(node, 0.01, () => ({ width: 0, height: 0 }));
      node.unsetMeasureFunc();
    }).to.not.throw();
  });
});

describe("flex node", () => {
  let yoga: any;
  let parent: FlexNode;
  let child1: FlexNode;
  let child2: FlexNode;

  before(async () => {
    yoga = await loadYogaBase64();
    parent = new FlexNode(signal(yoga), 0.01, 1, () => {});
    child1 = parent.createChild();
    child2 = parent.createChild();
  });

  it("should receive yoga instance after setting up", () => {
    const yogaSignal = signal<Yoga | undefined>(undefined);
    const parent = new FlexNode(yogaSignal, 0.01, 1, () => {});
    const child1 = parent.createChild();
    const child2 = parent.createChild();
    child1.nextProperties.flexGrow = 0;
    child1.finalizeProperties();
    child1.nextProperties.flexGrow = 1;
    child1.finalizeProperties();
    child2.nextProperties.flexGrow = 1;
    child2.finalizeProperties();
    parent.nextProperties.height = 1;
    parent.finalizeProperties();
    expect(child1.outerBounds.value, "child 1 top").to.deep.equal([[0, 0], [0, 0]]);
    expect(child2.outerBounds.value, "child 2 top").to.deep.equal([[0, 0], [0, 0]]);
    yogaSignal.value = yoga;
    parent.calculateLayout();
    expect(child1.outerBounds.value, "child 1 top").to.deep.equal([[0, 0.25], [0, 0.5]]);
    expect(child2.outerBounds.value, "child 2 top").to.deep.equal([[0, -0.25], [0, 0.5]]);
  });

  it("should add children in order", () => {
    child1.nextProperties.flexGrow = 1;
    child1.finalizeProperties();
    child2.nextProperties.flexGrow = 1;
    child2.finalizeProperties();
    parent.nextProperties.height = 1;
    parent.finalizeProperties();
    parent.calculateLayout();
    expect(child1.outerBounds.value[0][1], "child 1 top").to.equal(0);
    expect(child1.outerBounds.value[1][1], "child 1 height").to.equal(0.5);
    expect(child2.outerBounds.value[0][1], "child 2 top").to.equal(0.5);
    expect(child2.outerBounds.value[1][1], "child 2 height").to.equal(0.5);
  });

  it("should remove a property", () => {
    //no addProperties => remove all
    child1.finalizeProperties();
    parent.calculateLayout();
    expect(child1.outerBounds.value[0][1], "child 1 top").to.equal(0);
    expect(child1.outerBounds.value[1][1], "child 1 height").to.equal(0);
    expect(child2.outerBounds.value[0][1], "child 2 top").to.equal(0);
    expect(child2.outerBounds.value[1][1], "child 2 height").to.equal(1);
  });

  it("change children order", () => {
    child1.nextProperties.flexGrow = 1;
    child1.finalizeProperties();
    child1.index = 1;
    child2.index = 0;
    parent.calculateLayout();
    expect(child1.outerBounds.value[0][1], "child 1 top").to.equal(0.5);
    expect(child1.outerBounds.value[1][1], "child 1 height").to.equal(0.5);
    expect(child2.outerBounds.value[0][1], "child 2 top").to.equal(0);
    expect(child2.outerBounds.value[1][1], "child 2 height").to.equal(0.5);
  });

  it("change nothing", () => {
    parent.calculateLayout();
    expect(child1.outerBounds.value[0][1], "child 1 top").to.equal(0.5);
    expect(child1.outerBounds.value[1][1], "child 1 height").to.equal(0.5);
    expect(child2.outerBounds.value[0][1], "child 2 top").to.equal(0);
    expect(child2.outerBounds.value[1][1], "child 2 height").to.equal(0.5);
  });

  it("remove child & destroy before commit", () => {
    parent.removeChild(child2);
    child2.destroy();
    parent.nextProperties.height = 2;
    parent.finalizeProperties();
    parent.calculateLayout();
    expect(child1.outerBounds.value[0][1], "child 1 top").to.equal(0);
    expect(child1.outerBounds.value[1][1], "child 1 height").to.equal(2);
  });

  it("remove child & destroy after commit", () => {
    const c = parent.createChild();
    parent.removeChild(c);
    parent.calculateLayout();
    expect(child1.outerBounds.value[0][1], "child 1 top").to.equal(0);
    expect(child1.outerBounds.value[1][1], "child 1 height").to.equal(2);
    c.destroy();
  });

  it("use percentage", () => {
    child1.nextProperties.height = "25%";
    child1.finalizeProperties();
    parent.calculateLayout();
    expect(child1.outerBounds.value[0][1], "child 1 top").to.equal(0);
    expect(child1.outerBounds.value[1][1], "child 1 height").to.equal(0.5);
  });

  it("use absolute value", () => {
    child1.nextProperties.height = 0.33;
    child1.finalizeProperties();
    parent.calculateLayout();
    expect(child1.outerBounds.value[0][1], "child 1 top").to.equal(0);
    expect(child1.outerBounds.value[1][1], "child 1 height").to.equal(0.33);
  });
});

function equal(val1: any, val2: any) {
  return val1 === val2 || (isNaN(val1) && isNaN(val2));
}

function flatten(val: any): any {
  if (val == null) {
    return val;
  }
  if (typeof val === "object" && "value" in val) {
    return val.value;
  }
  return val;
}
