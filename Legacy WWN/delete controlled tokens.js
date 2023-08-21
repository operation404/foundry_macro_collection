try {
    Boneyard.Socketlib_Companion.executeAsGM(
        (args) => game.scenes.get(args.scene_id)?.deleteEmbeddedDocuments('Token', args.token_ids),
        {
            token_ids: canvas.tokens.controlled.map((t) => t.id),
            scene_id: canvas.scene.id,
        }
    );
} catch (e) {
    const err_msg =
        e.name === 'SocketlibNoGMConnectedError'
            ? "Error: Can't run 'Healing Touch' macro, no GM client available."
            : 'Error: ' + e.message;
    console.error(e);
    console.error(err_msg);
}
