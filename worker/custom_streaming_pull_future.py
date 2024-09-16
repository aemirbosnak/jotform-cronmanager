from google.cloud.pubsub_v1.subscriber.futures import StreamingPullFuture


class CustomStreamingPullFuture(StreamingPullFuture):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.subscription_path: str = None


# adding subscription_path because for some reason you can't derive it from the original class
# and for dynamic attribute assignment, syntax highlighters and linters complain about it
