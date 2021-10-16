import React from "react";
import { Helmet } from "react-helmet";
import { Row, Col, Form, Input, Checkbox, Button } from "antd";
import { jsPDF } from "jspdf";

const style = { padding: "16px" };
const IndexPage = () => {
    return (
        <main>
            <Helmet title="foo bar" defer={true}>
                <script
                    defer={true}
                    src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.4.0/jspdf.umd.min.js"
                />
            </Helmet>
            <Row>
                <Col md={2} lg={4} xl={5} xxl={6} />
                <Col style={style} xs={24} md={20} lg={16} xl={14} xxl={12}>
                    <FormVerbs />
                </Col>
                <Col xs={0} md={2} lg={4} xl={5} xxl={6} />
            </Row>
        </main>
    );
};

const FormVerbs = () => {
    return (
        <Form
            name="basic"
            layout="vertical"
            initialValues={{
                present: true,
                simple_past: true,
                future: true,
                verbs: "to need\nto change\nto plan\nto oder\nto decide\nto develop\nto jump\nto listen to",
            }}
            autoComplete="off"
            onFinish={onFinish}
        >
            <Row gutter={{ md: 24 }}>
                <Col xs={24} md={12}>
                    <Form.Item
                        name="verbs"
                        label="Enter verbs"
                        required
                        wrapperCol={{ span: 24 }}
                    >
                        <Input.TextArea
                            onBlur={prepareVerbs}
                            allowClear={true}
                            style={{ minHeight: "12em" }}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item label="Set tenses" wrapperCol={{ span: 24 }}>
                        <Form.Item
                            name="present"
                            valuePropName="checked"
                            wrapperCol={{ span: 24 }}
                        >
                            <Checkbox>Present</Checkbox>
                        </Form.Item>
                        <Form.Item name="simple_past" valuePropName="checked">
                            <Checkbox>Simple past</Checkbox>
                        </Form.Item>
                        <Form.Item name="future" valuePropName="checked">
                            <Checkbox>Future</Checkbox>
                        </Form.Item>
                    </Form.Item>
                </Col>
            </Row>
            <Row justify="center">
                <Col xs={18} md={12}>
                    <Form.Item wrapperCol={{ span: 24 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            size="large"
                            block
                        >
                            Generate PDF...
                        </Button>
                    </Form.Item>
                </Col>
            </Row>
        </Form>
    );
};

const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
};

const prepareDoc = (v) => {
    if (v.verbs === undefined || v.verbs.length === 0) {
        return;
    }

    const verbs = v.verbs.split("\n");

    let doc = verbs.map((verb) => {
        const task = {
            verb: verb,
            tense: "",
            form: "",
            pronoun: "",
        };

        return task;
    });

    const filtered = Object.keys(v).filter(
        (i) => i !== "verbs" && v[i] === true
    );

    doc = mergeTask(doc, filtered, (task, item) => {
        switch (item) {
            case "present":
                return {
                    ...task,
                    tense: "Present",
                };

            case "simple_past":
                return {
                    ...task,
                    tense: "Simple past",
                };
            case "future":
                return {
                    ...task,
                    tense: "Future",
                };
        }
    });

    const forms = ["positive", "negative", "question"];
    doc = mergeTask(doc, forms, (task, item) => ({ ...task, form: item }));

    const pronouns = ["I", "you", "he", "she", "it", "we", "they"];
    doc = mergeTask(doc, pronouns, (task, pronoun) => ({ ...task, pronoun }));

    return shuffleVerb(doc);
};

// to need
// to change
// to plan
// to oder
// to decide
// to develop
// to jump
// to listen to
const shuffleVerb = (doc) => {
    const uniq = new Set();
    for (let idx = 0; idx < doc.length; idx++) {
        const { verb } = doc[idx];
        uniq.add(verb);
    }

    let res = [];
    uniq.forEach((u) => {
        const filtered = doc.filter((i) => i.verb === u);
        shuffleArray(filtered);
        res = [...res, ...filtered];
    });

    return res;
};

const mergeTask = (tasks, items, cb) => {
    const result = [];

    for (let i = 0; i < tasks.length; i++) {
        for (let n = 0; n < items.length; n++) {
            result.push(cb(tasks[i], items[n]));
        }
    }

    return result;
};

const onFinish = (v) => {
    const doc = prepareDoc(v);

    const pdf = new jsPDF();

    pdf.setFontSize(12);

    let xLine = 0;
    for (let idx = 0; idx < doc.length; idx++) {
        const { tense, form, pronoun } = doc[idx];
        const l = pdf.getTextWidth(`${tense}, ${form}, (${pronoun})`);
        if (xLine < l) {
            xLine = l;
        }
    }

    const maxHeight = 260;
    let page = 1;
    let itemOnPage = 0;
    let titlePage = "";
    for (let idx = 0; idx < doc.length; idx++) {
        const { verb, tense, form, pronoun } = doc[idx];

        if (verb !== titlePage) {
            if (page > 1) {
                pdf.addPage("a4", "portrait");
                page++;
                pdf.setPage(page);
            }
            itemOnPage = 0;

            titlePage = verb;
            pdf.setFontSize(16);
            pdf.text(titlePage, 10, 20);
            pdf.setFontSize(12);
        }

        if (maxHeight < y) {
            page++;
            itemOnPage = 0;
            pdf.addPage("a4", "portrait");
            pdf.setPage(page);

            pdf.setFontSize(16);
            pdf.text(titlePage, 10, 20);
            pdf.setFontSize(12);
        }

        const y = addLine(
            pdf,
            itemOnPage,
            `${tense}, ${form}, (${pronoun})`,
            xLine
        );

        itemOnPage++;
    }

    pdf.save("a4.pdf");
};

const addLine = (pdf, number, text, xLine) => {
    const verticalOffset = 40;
    const horisontalOffset = 10;
    const heightLine = 10;
    const yText = verticalOffset + heightLine * number;

    pdf.text(text, horisontalOffset, yText);
    pdf.line(xLine + 10, yText + 2, 200, yText + 2, "S");

    return yText;
};

const prepareVerbs = (e) => {
    console.log(e.target.value);
};

export default IndexPage;
