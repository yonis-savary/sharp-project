<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
</head>
<style>

    @keyframes slide-in {
        from { transform: translateY(-1em); opacity: 0; }
        to { transform: translateY(0%); opacity: 1; }
    }

    body > *
    {
        animation: slide-in 1s;
    }

    *
    {
        margin: 0;
        letter-spacing: .06em;
    }

    :root
    {
        font-size: 22px;
        font-family: Arial, Helvetica, sans-serif;

        color: #030033;
    }

    html
    {
        width: 100vw;
        height: 100vh;
        background: radial-gradient(#f3f3fb 50%, #00006115) no-repeat;
    }

    body
    {
        width: 100vw;
        height: 80vh;

        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1em;
    }

    p
    {
        max-width: 50ch;
        text-align: center;
        line-height: 1.5em;
    }

    hr
    {
        width: 10em;
    }

</style>
<body>
    <h1>Welcome.</h1>
    <p>Many thanks for using (or trying out) Sharp !</p>
    <hr>
    <p>
        If you want to learn more about Sharp PHP, you can read the
        <a target="_blank" href="https://github.com/yonis-savary/sharp">project's readme</a> or dive into its
        <a target="_blank" href="https://github.com/yonis-savary/sharp/tree/main/docs">documentation</a>.
    </p>
</body>
</html>