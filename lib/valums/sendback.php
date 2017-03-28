<?php
function load($input) {
    $content = stream_get_contents($input);

    if (!$content) {
        return array('error' => 'Unable to upload file');
    }

    $size = count($content);
    if ($size == 0) {
        return array('error' => 'File is empty');
    }

    $doc = new DOMDocument();
    $doc->loadXML($content);
    $doc->normalizeDocument();

    $valid = true; //$doc->schemaValidate("ElVisML-0.5.xsd");
    if (!$valid) {
        return array('error' => 'Not a valid ElVisML file.');
    } else {
        $content = $doc->saveXML();
    }

    return array('success' => true, 'content' => base64_encode($content));
}

if (isset($_GET['qqfile'])) {
    $input = fopen("php://input", "r");
    $result = load($input);
} elseif (isset($_FILES['qqfile'])) {
    $input = fopen($_FILES['qqfile']['tmp_name'], "r");
    $result = load($input);
} else {
    $result = array('error' => 'No files were uploaded.');
}

echo(json_encode($result));
?>